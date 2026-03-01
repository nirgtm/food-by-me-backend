const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('data')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to load restaurants' });
    }

    const restaurants = (data || []).map((row) => row.data);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load restaurants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('data')
      .eq('id', req.params.id)
      .limit(1);

    if (error) {
      return res.status(500).json({ error: 'Failed to load restaurant' });
    }

    const restaurant = data?.[0]?.data;
    restaurant ? res.json(restaurant) : res.status(404).json({ error: "Restaurant not found" });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load restaurant' });
  }
});

module.exports = router;
