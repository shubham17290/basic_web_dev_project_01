const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const publicDir = path.join(__dirname, '.');
app.use(express.static(publicDir));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'my-javadoc-portal-backend',
    pages: ['index.html', 'package-summary.html', 'allclasses.html', 'Love.html', 'hum.html', 'constant-values.html']
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
