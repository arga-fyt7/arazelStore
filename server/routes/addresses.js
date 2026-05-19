import { Router } from 'express'
import pool from '../config/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    )
    res.json({ addresses: rows })
  } catch (err) {
    console.error('Get addresses error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try {
    const { label, recipientName, recipientPhone, streetAddress, notes, isDefault } = req.body

    if (!label || !recipientName || !recipientPhone || !streetAddress) {
      return res.status(400).json({ message: 'Semua field wajib diisi' })
    }

    const userId = req.user.id

    if (isDefault) {
      await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId])
    }

    const [result] = await pool.query(
      'INSERT INTO user_addresses (user_id, label, recipient_name, recipient_phone, street_address, notes, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, label, recipientName, recipientPhone, streetAddress, notes || null, isDefault || false]
    )

    const [rows] = await pool.query('SELECT * FROM user_addresses WHERE id = ?', [result.insertId])

    res.status(201).json({ message: 'Alamat berhasil ditambahkan', address: rows[0] })
  } catch (err) {
    console.error('Create address error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { label, recipientName, recipientPhone, streetAddress, notes, isDefault } = req.body
    const addressId = req.params.id
    const userId = req.user.id

    const [existing] = await pool.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' })
    }

    if (isDefault) {
      await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId])
    }

    await pool.query(
      'UPDATE user_addresses SET label = ?, recipient_name = ?, recipient_phone = ?, street_address = ?, notes = ?, is_default = ? WHERE id = ? AND user_id = ?',
      [label, recipientName, recipientPhone, streetAddress, notes || null, isDefault || false, addressId, userId]
    )

    const [rows] = await pool.query('SELECT * FROM user_addresses WHERE id = ?', [addressId])

    res.json({ message: 'Alamat berhasil diperbarui', address: rows[0] })
  } catch (err) {
    console.error('Update address error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/:id/default', verifyToken, async (req, res) => {
  try {
    const addressId = req.params.id
    const userId = req.user.id

    const [existing] = await pool.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' })
    }

    await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId])
    await pool.query('UPDATE user_addresses SET is_default = TRUE WHERE id = ?', [addressId])

    res.json({ message: 'Alamat utama berhasil diubah' })
  } catch (err) {
    console.error('Set default address error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const addressId = req.params.id
    const userId = req.user.id

    const [existing] = await pool.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' })
    }

    const wasDefault = existing[0].is_default

    await pool.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId])

    if (wasDefault) {
      const [remaining] = await pool.query(
        'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      )
      if (remaining.length > 0) {
        await pool.query('UPDATE user_addresses SET is_default = TRUE WHERE id = ?', [remaining[0].id])
      }
    }

    res.json({ message: 'Alamat berhasil dihapus' })
  } catch (err) {
    console.error('Delete address error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
