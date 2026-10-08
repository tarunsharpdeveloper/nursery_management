const { pool } = require('./backend/db');

(async () => {
  try {
    const [allRows] = await pool.query(
      'SELECT id, media_type, title, media_url, thumbnail_url FROM gallery_items LIMIT 10'
    );
    console.log('All gallery items:');
    console.log(JSON.stringify(allRows, null, 2));
    
    const [videos] = await pool.query(
      'SELECT COUNT(*) as count FROM gallery_items WHERE media_type = ?',
      ['video']
    );
    console.log('\nVideo count:', videos[0].count);
    
    const [photos] = await pool.query(
      'SELECT COUNT(*) as count FROM gallery_items WHERE media_type = ?',
      ['image']
    );
    console.log('Photo count:', photos[0].count);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
