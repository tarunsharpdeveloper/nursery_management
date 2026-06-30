const express = require('express');
const path = require('path');
const fs = require('fs');
 
app.use(express.static(path.join(__dirname, '../../frontend/out')));
 
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../../frontend/out/index.html');
 
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Frontend build not found. API is running.');
  }
});