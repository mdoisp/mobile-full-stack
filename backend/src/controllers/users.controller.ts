import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { DatabaseFactory } from '../database/DatabaseFactory.js';
import { AuthService } from '../services/auth.service.js';

// GET /users/me - Ver próprio perfil
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const db = DatabaseFactory.getDatabase();
    const user = await db.getUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: String(error) });
  }
};

// PUT /users/me - Atualizar próprio perfil
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, photoUrl } = req.body;
    const db = DatabaseFactory.getDatabase();

    const updated = await DatabaseFactory.syncToBoth(db =>
      db.updateUser(req.user!.userId, { name, photoUrl })
    );

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = updated;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: String(error) });
  }
};

// GET /users - Listar usuários (com permissões)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const db = DatabaseFactory.getDatabase();
    const currentUserRole = req.user!.role;
    let users = await db.getAllUsers();

    // Filtrar baseado no role
    if (currentUserRole === 'secretaria') {
      // Secretaria vê professores e estudantes
      users = users.filter(u => u.role === 'professor' || u.role === 'estudante');
    } else if (currentUserRole === 'professor') {
      // Professor vê apenas estudantes
      users = users.filter(u => u.role === 'estudante');
    } else if (currentUserRole === 'estudante') {
      // Estudante vê apenas ele mesmo
      users = users.filter(u => u.id === req.user!.userId);
    }
    // Admin vê todos

    // Remove senhas
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.status(200).json(usersWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: String(error) });
  }
};

// GET /users/:id - Ver usuário específico (com permissões)
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const db = DatabaseFactory.getDatabase();
    const user = await db.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserRole = req.user!.role;
    const currentUserId = req.user!.userId;

    // Verificar permissão
    if (currentUserRole === 'estudante' && user.id !== currentUserId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (currentUserRole === 'professor' && user.role !== 'estudante' && user.id !== currentUserId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (currentUserRole === 'secretaria' && 
        user.role !== 'professor' && 
        user.role !== 'estudante' && 
        user.id !== currentUserId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: String(error) });
  }
};

// PUT /users/:id - Atualizar usuário (apenas Admin pode trocar email)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const { name, email, photoUrl, password } = req.body;
    const currentUserRole = req.user!.role;
    const currentUserId = req.user!.userId;

    const db = DatabaseFactory.getDatabase();
    const targetUser = await db.getUserById(id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verificar permissões de edição
    // Admin pode editar todos
    // Secretaria pode editar: ela mesma, professores e estudantes (não pode editar admin)
    // Professor e Estudante só podem editar eles mesmos
    if (currentUserRole === 'admin') {
      // Admin pode editar qualquer um
    } else if (currentUserRole === 'secretaria') {
      // Secretaria não pode editar admin
      if (targetUser.role === 'admin' && id !== currentUserId) {
        return res.status(403).json({ message: 'Secretaria cannot edit admin users' });
      }
      // Pode editar: ela mesma, professores e estudantes
      if (id !== currentUserId && targetUser.role !== 'professor' && targetUser.role !== 'estudante') {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      // Professor e Estudante só podem editar eles mesmos
      if (id !== currentUserId) {
        return res.status(403).json({ message: 'You can only edit your own profile' });
      }
    }

    // Apenas admin pode alterar email
    if (email && currentUserRole !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change email' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (email && currentUserRole === 'admin') updateData.email = email;
    if (password) updateData.password = await AuthService.hashPassword(password);

    // Atualizar no primário
    const updated = await db.updateUser(id, updateData);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sincronizar no secundário usando email
    DatabaseFactory.syncUserUpdateToSecondary(targetUser.email, updateData)
      .catch(err => console.error('Secondary sync failed:', err));

    const { password: _, ...userWithoutPassword } = updated;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: String(error) });
  }
};

// DELETE /users/:id - Deletar usuário (Apenas Admin pode deletar)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Apenas Admin pode deletar
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem deletar usuários' });
    }

    const db = DatabaseFactory.getDatabase();
    
    // Buscar email antes de deletar
    const userToDelete = await db.getUserById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Deletar do primário
    const success = await db.deleteUser(id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sincronizar delete no secundário
    DatabaseFactory.syncUserDeleteToSecondary(userToDelete.email)
      .catch(err => console.error('Secondary delete failed:', err));

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: String(error) });
  }
};
