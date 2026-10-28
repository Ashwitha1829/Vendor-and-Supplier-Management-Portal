const express = require('express');
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { requiredText, optionalText } = require('../utils/validate');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (req.query.search) query = query.or(`name.ilike.%${String(req.query.search).replace(/[,%()]/g, '')}%,contact_person.ilike.%${String(req.query.search).replace(/[,%()]/g, '')}%,email.ilike.%${String(req.query.search).replace(/[,%()]/g, '')}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ suppliers: data });
  } catch (err) { next(err); }
});
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {};
    const error = requiredText(b.name, 'Supplier name', 120) || requiredText(b.contact_person, 'Contact person', 100)
      || requiredText(b.phone, 'Phone', 30) || optionalText(b.email, 'Email', 150)
      || optionalText(b.category, 'Category', 80) || optionalText(b.address, 'Address', 300);
    if (error) return res.status(400).json({ error });
    const { data, error: dbError } = await supabase.from('suppliers').insert({
      name:b.name.trim(), contact_person:b.contact_person.trim(), phone:b.phone.trim(),
      email:b.email?.trim() || null, category:b.category?.trim() || null, address:b.address?.trim() || null,
      status: ['active','inactive'].includes(b.status) ? b.status : 'active', notes:b.notes?.trim() || null,
      created_by:req.user.sub
    }).select('*').single();
    if (dbError) throw dbError;
    res.status(201).json({ supplier:data });
  } catch (err) { next(err); }
});
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {};
    const error = requiredText(b.name, 'Supplier name', 120) || requiredText(b.contact_person, 'Contact person', 100)
      || requiredText(b.phone, 'Phone', 30) || optionalText(b.email, 'Email', 150);
    if (error) return res.status(400).json({ error });
    const { data, error: dbError } = await supabase.from('suppliers').update({
      name:b.name.trim(), contact_person:b.contact_person.trim(), phone:b.phone.trim(),
      email:b.email?.trim() || null, category:b.category?.trim() || null, address:b.address?.trim() || null,
      status:['active','inactive'].includes(b.status) ? b.status : 'active', notes:b.notes?.trim() || null,
      updated_at:new Date().toISOString()
    }).eq('id', req.params.id).select('*').maybeSingle();
    if (dbError) throw dbError;
    if (!data) return res.status(404).json({ error:'Supplier not found.' });
    res.json({ supplier:data });
  } catch (err) { next(err); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message:'Supplier deleted.' });
  } catch (err) { next(err); }
});
module.exports = router;
