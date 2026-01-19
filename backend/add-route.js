// Add this route to server.js after the dashboard route:

app.get('/main-dashboard', (req, res) => {
    console.log('📄 Serving main dashboard');
    res.sendFile(path.join(__dirname, 'main-dashboard.html'));
});