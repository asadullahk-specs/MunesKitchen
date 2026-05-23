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

        const admin = await Admin.findOne({ where: { email } })
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
            admin: { id: admin.id, name: admin.name, email: admin.email },
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
        const admin = await Admin.findByPk(req.admin.id)

        const isMatch = await bcrypt.compare(currentPassword, admin.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' })
        }

        const hashed = await bcrypt.hash(newPassword, 10)
        await admin.update({ password: hashed })

        res.json({ success: true, message: 'Password updated successfully.' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}