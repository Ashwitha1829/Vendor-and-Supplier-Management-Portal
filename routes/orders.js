const express = require('express');
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { requiredText } = require('../utils/validate');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('purchase_orders')
      .select('*, suppliers(name), vendors(name)').order('created_at', { ascending:false });
    if (error) throw error;
    res.json({ orders:data });
  } catch (err) { next(err); }
});
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {};
    const error = requiredText(b.title, 'Order title', 150)
      || (!b.supplier_id ? 'Choose a supplier.' : null)
      || (!b.vendor_id ? 'Choose a vendor.' : null)
      || (!Number.isFinite(Number(b.amount)) || Number(b.amount) <= 0 ? 'Amount must be greater than zero.' : null)
      || (!b.due_date || !/^\\d{4}-\\d{2}-\\d{2}$/.test(b.due_date) ? 'Enter a valid due date.' : null);
    if (error) return res.status(400).json({ error });
    const { data, error: dbError } = await supabase.from('purchase_orders').insert({
      title:b.title.trim(), supplier_id:b.supplier_id, vendor_id:b.vendor_id,
      amount:Number(b.amount), due_date:b.due_date,
      status:['draft','pending','approved','completed','cancelled'].includes(b.status) ? b.status : 'pending',
      notes:b.notes?.trim() || null, created_by:req.user.sub
    }).select('*, suppliers(name), vendors(name)').single();
    if (dbError) throw dbError;
    res.status(201).json({ order:data });
  } catch (err) { next(err); }
});
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const allowed = ['draft','pending','approved','completed','cancelled'];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({ error:'Invalid order status.' });
    const { data, error } = await supabase.from('purchase_orders').update({
      status:req.body.status, updated_at:new Date().toISOString()
    }).eq('id', req.params.id).select('*, suppliers(name), vendors(name)').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error:'Purchase order not found.' });
    res.json({ order:data });
  } catch (err) { next(err); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message:'Purchase order deleted.' });
  } catch (err) { next(err); }
});
module.exports = router;
