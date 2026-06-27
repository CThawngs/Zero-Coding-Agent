import express from 'express';
import * as terminalService from '../services/terminalService.js';

const router = express.Router();

// ============================================================
// EXECUTE COMMAND (direct, approved)
// ============================================================
router.post('/execute', async (req, res) => {
  try {
    const { command, cwd } = req.body;
    if (!command) return res.status(400).json({ error: 'command is required' });
    
    const result = await terminalService.executeCommand(command, cwd);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// APPROVE PENDING COMMAND
// ============================================================
router.post('/approve', async (req, res) => {
  try {
    const { commandId } = req.body;
    if (!commandId) return res.status(400).json({ error: 'commandId is required' });
    
    const result = await terminalService.approveCommand(commandId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// REJECT PENDING COMMAND
// ============================================================
router.post('/reject', async (req, res) => {
  try {
    const { commandId } = req.body;
    if (!commandId) return res.status(400).json({ error: 'commandId is required' });
    
    const result = terminalService.rejectCommand(commandId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LIST RUNNING COMMANDS
// ============================================================
router.get('/running', (req, res) => {
  const running = terminalService.listRunningCommands();
  const pending = terminalService.listPendingApprovals();
  res.json({ running, pending });
});

// ============================================================
// KILL RUNNING COMMAND
// ============================================================
router.delete('/kill/:id', (req, res) => {
  try {
    const result = terminalService.killCommand(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
