import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Jeisys API Server is running' });
});

// Example: Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Example: Create a user (Sign up)
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { userId, password, name, hospitalName, phone, email } = req.body;
        // In a real app, hash the password here (e.g. using bcrypt)
        const newUser = await prisma.user.create({
            data: {
                userId,
                passwordHash: password, // TODO: Hash this!
                name,
                hospitalName,
                phone,
                // ... map other fields
            },
        });
        res.json(newUser);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'User creation failed' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
