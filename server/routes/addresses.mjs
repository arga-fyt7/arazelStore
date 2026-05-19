import { Router } from 'express'
import Address from '../models/Address.mjs'
import { verifyToken } from '../middleware/auth.mjs'

const router = Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 })
    res.json({ addresses: addresses.map(a => ({ id: a._id, user_id: a.userId, label: a.label, recipient_name: a.recipientName, recipient_phone: a.recipientPhone, street_address: a.streetAddress, notes: a.notes, is_default: a.isDefault, created_at: a.createdAt })) })
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
      await Address.updateMany({ userId }, { isDefault: false })
    }

    const address = await Address.create({
      userId, label, recipientName, recipientPhone, streetAddress, notes: notes || null, isDefault: isDefault || false,
    })

    res.status(201).json({ message: 'Alamat berhasil ditambahkan', address: { id: address._id, user_id: address.userId, label: address.label, recipient_name: address.recipientName, recipient_phone: address.recipientPhone, street_address: address.streetAddress, notes: address.notes, is_default: address.isDefault, created_at: address.createdAt } })
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

    const existing = await Address.findOne({ _id: addressId, userId })
    if (!existing) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' })
    }

    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false })
    }

    const address = await Address.findByIdAndUpdate(addressId,
      { label, recipientName, recipientPhone, streetAddress, notes: notes || null, isDefault: isDefault || false },
      { new: true }
    )

    res.json({ message: 'Alamat berhasil diperbarui', address: { id: address._id, user_id: address.userId, label: address.label, recipient_name: address.recipientName, recipient_phone: address.recipientPhone, street_address: address.streetAddress, notes: address.notes, is_default: address.isDefault, created_at: address.createdAt } })
  } catch (err) {
    console.error('Update address error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

router.put('/:id/default', verifyToken, async (req, res) => {
  try {
    const addressId = req.params.id
    const userId = req.user.id

    const existing = await Address.findOne({ _id: addressId, userId })
    if (!existing) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' })
    }

    await Address.updateMany({ userId }, { isDefault: false })
    await Address.findByIdAndUpdate(addressId, { isDefault: true })

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

    const existing = await Address.findOne({ _id: addressId, userId })
    if (!existing) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' })
    }

    const wasDefault = existing.isDefault
    await Address.deleteOne({ _id: addressId, userId })

    if (wasDefault) {
      const remaining = await Address.findOne({ userId }).sort({ createdAt: -1 })
      if (remaining) {
        await Address.findByIdAndUpdate(remaining._id, { isDefault: true })
      }
    }

    res.json({ message: 'Alamat berhasil dihapus' })
  } catch (err) {
    console.error('Delete address error:', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

export default router
