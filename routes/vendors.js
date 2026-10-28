const express = require('express');
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { requiredText, optionalText, validEmail } = require('../utils/validate');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('vendors').select('*, suppliers(name)').order('created_at', { ascending:false });
    if (req.query.search) {
      const s = String(req.query.search).replace(/[,%()]/g, '');
      query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,service_type.ilike.%${s}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ vendors:data });
  } catch (err) { next(err); }
});
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {};
    const error = requiredText(b.name, 'Vendor name', 120) || (b.email && !validEmail(b.email) ? 'Enter a valid email address.' : null)
      || requiredText(b.service_type, 'Service type', 100) || optionalText(b.phone, 'Phone', 30);
    if (error) return res.status(400).json({ error });
    const { data, error: dbError } = await supabase.from('vendors').insert({
      name:b.name.trim(), email:b.email?.trim().toLowerCase() || null, phone:b.phone?.trim() || null,
      service_type:b.service_type.trim(), supplier_id:b.supplier_id || null,
      status:['active','inactive','pending'].includes(b.status) ? b.status : 'pending',
      notes:b.notes?.trim() || null, created_by:req.user.sub
    }).select('*, suppliers(name)').single();
    if (dbError) throw dbError;
    res.status(201).json({ vendor:data });
  } catch (err) { next(err); }
});
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {};
    const error = requiredText(b.name, 'Vendor name', 120) || requiredText(b.service_type, 'Service type', 100)
      || (b.email && !validEmail(b.email) ? 'Enter a valid email address.' : null);
    if (error) return res.status(400).json({ error });
    const { data, error: dbError } = await supabase.from('vendors').update({
      name:b.name.trim(), email:b.email?.trim().toLowerCase() || null, phone:b.phone?.trim() || null,
      service_type:b.service_type.trim(), supplier_id:b.supplier_id || null,
      status:['active','inactive','pending'].includes(b.status) ? b.status : 'pending',
      notes:b.notes?.trim() || null, updated_at:new Date().toISOString()
    }).eq('id', req.params.id).select('*, suppliers(name)').maybeSingle();
    if (dbError) throw dbError;
    if (!data) return res.status(404).json({ error:'Vendor not found.' });
    res.json({ vendor:data });
  } catch (err) { next(err); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase.from('vendors').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message:'Vendor deleted.' });
  } catch (err) { next(err); }
});
module.exports = router;
