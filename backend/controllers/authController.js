const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Admin } = require('../models')
require('dotenv').config()

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' })
        }

        const admin = await Admin.findOne({ email })
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' })
        }

        const isMatch = await bcrypt.compare(password, admin.password)
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' })
        }

        const token = generateToken(admin.id)

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        res.json({
            success: true,
            token,
            admin: { id: admin.id, name: admin.name, email: admin.email, profile_image: admin.profile_image || '' },
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getMe = async (req, res) => {
    res.json({ success: true, admin: req.admin })
}

exports.logout = async (req, res) => {
    res.cookie('token', '', { expires: new Date(0) })
    res.json({ success: true, message: 'Logged out successfully.' })
}

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const admin = await Admin.findById(req.admin.id)

        const isMatch = await bcrypt.compare(currentPassword, admin.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' })
        }

        const hashed = await bcrypt.hash(newPassword, 10)
        await admin.updateOne({ password: hashed })

        res.json({ success: true, message: 'Password updated successfully.' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// ── Admin CRUD (Security Tab) ─────────────────────────────────────────────────

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().sort({ created_at: 1 })
        // Return admins with hashed password for display in security tab
        const adminList = admins.map(a => ({
            id: a.id,
            name: a.name,
            email: a.email,
            passwordHash: a.password, // bcrypt hash for display
            profile_image: a.profile_image || ''
        }))
        res.json({ success: true, data: adminList })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, profile_image } = req.body
        if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required.' })
        if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'Email is required.' })
        if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' })

        const existing = await Admin.findOne({ email: email.trim().toLowerCase() })
        if (existing) return res.status(400).json({ success: false, message: 'An admin with this email already exists.' })

        const hashed = await bcrypt.hash(password, 10)
        const newAdmin = await Admin.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashed,
            profile_image: profile_image || ''
        })

        res.status(201).json({
            success: true,
            message: 'Admin created successfully.',
            data: {
                id: newAdmin.id,
                name: newAdmin.name,
                email: newAdmin.email,
                passwordHash: newAdmin.password,
                profile_image: newAdmin.profile_image || ''
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.updateAdmin = async (req, res) => {
    try {
        const { name, email, password, profile_image } = req.body
        const adminToUpdate = await Admin.findById(req.params.id)
        if (!adminToUpdate) return res.status(404).json({ success: false, message: 'Admin not found.' })

        if (name && name.trim()) adminToUpdate.name = name.trim()
        if (email && email.trim()) {
            const existing = await Admin.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.params.id } })
            if (existing) return res.status(400).json({ success: false, message: 'Email already in use by another admin.' })
            adminToUpdate.email = email.trim().toLowerCase()
        }
        if (password && password.length >= 6) {
            adminToUpdate.password = await bcrypt.hash(password, 10)
        }
        if (profile_image !== undefined) {
            adminToUpdate.profile_image = profile_image
        }

        await adminToUpdate.save()

        res.json({
            success: true,
            message: 'Admin updated successfully.',
            data: {
                id: adminToUpdate.id,
                name: adminToUpdate.name,
                email: adminToUpdate.email,
                passwordHash: adminToUpdate.password,
                profile_image: adminToUpdate.profile_image || ''
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.deleteAdmin = async (req, res) => {
    try {
        const count = await Admin.countDocuments()
        if (count <= 1) return res.status(400).json({ success: false, message: 'Cannot delete the last admin account.' })

        // Prevent self-deletion
        if (req.params.id === req.admin.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account.' })
        }

        const deleted = await Admin.findByIdAndDelete(req.params.id)
        if (!deleted) return res.status(404).json({ success: false, message: 'Admin not found.' })

        res.json({ success: true, message: 'Admin removed successfully.' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}