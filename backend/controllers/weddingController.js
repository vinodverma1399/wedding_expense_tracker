const Wedding = require('../models/Wedding');
const Expense = require('../models/Expense');
const Vendor = require('../models/Vendor');

const createWedding = async (req, res) => {
  try {
    const { weddingName, brideName, groomName, weddingDate, city, totalBudget } = req.body;
    
    const wedding = await Wedding.create({
      userId: req.user._id,
      weddingName,
      brideName,
      groomName,
      weddingDate,
      city,
      totalBudget
    });
    res.status(201).json(wedding);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWeddings = async (req, res) => {
  try {
    const weddings = await Wedding.find({ 
      $or: [
        { userId: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('userId', 'name email')
    .populate('members.user', 'name email');
    res.json(weddings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const wedding = await Wedding.findById(req.params.id);
    
    if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
    
    // Check if the requester is the owner
    if (wedding.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can invite members' });
    }

    const User = require('../models/User');
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) return res.status(404).json({ message: 'User not found with this email. They must sign up first.' });

    // Check if already a member
    const alreadyMember = wedding.members.find(m => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member of this wedding' });
    if (wedding.userId.toString() === userToInvite._id.toString()) return res.status(400).json({ message: 'Cannot invite the owner' });

    wedding.members.push({ user: userToInvite._id, role: role || 'Editor' });
    await wedding.save();

    // Send beautiful collaborative HTML invite email
    try {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: userToInvite.email,
        subject: `Collaboration Invite: ${wedding.weddingName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px;">🔔</span>
              <h1 style="color: #6d28d9; font-size: 24px; font-weight: 800; margin: 10px 0 0 0;">Wedding Collaboration Invite!</h1>
            </div>
            <p style="font-size: 16px; line-height: 1.5;">Hi <strong>${userToInvite.name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
              You have been invited by <strong>${req.user.name}</strong> (${req.user.email}) to collaborate as an <strong>${role || 'Editor'}</strong> on their wedding planner dashboard: <strong style="color: #6d28d9;">${wedding.weddingName}</strong>.
            </p>
            <p style="font-size: 15px; line-height: 1.5; color: #718096; margin-bottom: 24px;">
              Collaborate on managing vendors, tracking RSVPs, budgeting events, and instantly viewing live analytics in real-time.
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="http://localhost:5173" style="display: inline-block; padding: 14px 28px; color: #ffffff; background-color: #6d28d9; font-weight: bold; border-radius: 12px; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px rgba(109,40,217,0.2);">Accept & Access Dashboard</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin-bottom: 20px;" />
            <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">This is a system generated message from Wedding Expense Tracker SaaS.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }
    
    res.json({ message: 'Member invited successfully', wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWeddingById = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id);
    
    if (wedding && wedding.userId.toString() === req.user._id.toString()) {
      res.json(wedding);
    } else {
      res.status(404).json({ message: 'Wedding not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id);
    if (wedding && wedding.userId.toString() === req.user._id.toString()) {
      await Expense.deleteMany({ weddingId: wedding._id });
      await Vendor.deleteMany({ weddingId: wedding._id });
      await Wedding.deleteOne({ _id: wedding._id });
      res.json({ message: 'Wedding removed' });
    } else {
      res.status(404).json({ message: 'Wedding not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createWedding, getWeddings, getWeddingById, deleteWedding, inviteMember };
