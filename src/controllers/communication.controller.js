// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// In-memory communication storage (in production, you might want to use a database)
let communications = {};
let nextCommunicationId = 1;

// Get all communications
exports.getAllCommunications = async (req, res) => {
  try {
    const communicationList = Object.values(communications);
    res.json(communicationList);
  } catch (error) {
    console.error("Error fetching communications:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get communication by ID
exports.getCommunicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const communication = communications[id];
    
    if (!communication) {
      return res.status(404).json({ error: "Communication not found" });
    }
    
    res.json(communication);
  } catch (error) {
    console.error("Error fetching communication:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new communication
exports.createCommunication = async (req, res) => {
  try {
    const communicationData = req.body;
    const communicationId = `comm_${nextCommunicationId++}`;
    
    const communication = {
      id: communicationId,
      ...communicationData,
      status: 'pending', // Default status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    communications[communicationId] = communication;
    
    res.status(201).json(communication);
  } catch (error) {
    console.error("Error creating communication:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update communication
exports.updateCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    const communicationData = req.body;
    
    if (!communications[id]) {
      return res.status(404).json({ error: "Communication not found" });
    }
    
    const updatedCommunication = {
      ...communications[id],
      ...communicationData,
      id: id,
      updatedAt: new Date().toISOString()
    };
    
    communications[id] = updatedCommunication;
    
    res.json(updatedCommunication);
  } catch (error) {
    console.error("Error updating communication:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete communication
exports.deleteCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!communications[id]) {
      return res.status(404).json({ error: "Communication not found" });
    }
    
    delete communications[id];
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting communication:", error);
    res.status(500).json({ error: error.message });
  }
};

// Send communication (simulate sending)
exports.sendCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!communications[id]) {
      return res.status(404).json({ error: "Communication not found" });
    }
    
    communications[id].status = 'sent';
    communications[id].sentAt = new Date().toISOString();
    communications[id].updatedAt = new Date().toISOString();
    
    res.json(communications[id]);
  } catch (error) {
    console.error("Error sending communication:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search communications by subject or content
exports.searchCommunications = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    
    const matchingCommunications = Object.values(communications).filter(comm => 
      (comm.subject && comm.subject.toLowerCase().includes(query.toLowerCase())) ||
      (comm.content && comm.content.toLowerCase().includes(query.toLowerCase()))
    );
    
    res.json(matchingCommunications);
  } catch (error) {
    console.error("Error searching communications:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search similar communications (Stubbed out Pinecone)
exports.searchSimilarCommunications = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Error searching similar communications:", error);
    res.status(500).json({ error: error.message });
  }
};
