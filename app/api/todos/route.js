import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Todo from '@/models/Todo';
import { getUserIdFromToken } from '@/lib/auth';

export async function GET(request) {
    try {
        const userId = await getUserIdFromToken();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let filter = { userId };
        if (status) {
            if (status !== 'all') {
                filter.status = status;
            }
        }

        const todos = await Todo.find(filter).sort({ createdAt: -1 });

        return NextResponse.json({ todos });
    } catch (error) {
        console.error('Get todos error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const userId = await getUserIdFromToken();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description } = await request.json();

        if (!title || title.trim() === '') {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        await connectDB();

        const todo = await Todo.create({
            title,
            description: description || '',
            userId,
        });

        return NextResponse.json({ todo }, { status: 201 });
    } catch (error) {
        console.error('Create todo error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}