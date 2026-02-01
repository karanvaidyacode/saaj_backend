// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// Mock role data since we're removing Pinecone
let roles = [
  {
    id: "1",
    name: "Admin",
    permissions: ["read", "write", "delete", "manage_users"],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z")
  },
  {
    id: "2",
    name: "Manager",
    permissions: ["read", "write", "manage_products"],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z")
  },
  {
    id: "3",
    name: "Staff",
    permissions: ["read", "write"],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z")
  }
];

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles', error: error.message });
  }
};

// Get a role by ID
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = roles.find(role => role.id === id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ message: 'Error fetching role', error: error.message });
  }
};

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const newRole = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    roles.push(newRole);
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role: newRole
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Error creating role', error: error.message });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const index = roles.findIndex(role => role.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    const updatedRole = {
      ...roles[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    roles[index] = updatedRole;
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

// Delete a role
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const index = roles.findIndex(role => role.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    roles.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Error deleting role', error: error.message });
  }
};

// Check if user has permission
exports.checkPermission = async (req, res) => {
  try {
    const { roleId, permission } = req.body;
    
    if (!roleId || !permission) {
      return res.status(400).json({ error: "roleId and permission are required" });
    }
    
    // Simple lookup - logic can be improved as needed with proper roles object/array
    const role = roles.find(r => r.id === roleId);
    
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    const hasPermission = role.permissions.includes(permission);
    
    res.json({ hasPermission });
  } catch (error) {
    console.error("Error checking permission:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search similar roles (Stubbed out Pinecone)
exports.searchSimilarRoles = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Error searching similar roles:", error);
    res.status(500).json({ error: error.message });
  }
};
