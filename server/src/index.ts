import cors from 'cors';
import express from 'express';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
    response.json({
        status: 'ok',
    });
});

app.listen(port, () => (
    console.log('Server started on http://localhost:${port}')
));