'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const router = useRouter();

  // get todos when filter changes
  useEffect(() => {
    getTodos();
  }, [filter]);

  // inactivity logout after 30 min
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
        alert('Logged out due to inactivity');
      }, 30 * 60 * 1000);
    };
    
    window.addEventListener('click', reset);
    reset();
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', reset);
    };
  }, []);

  async function getTodos() {
    const res = await fetch(`/api/todos?status=${filter}`);
    if (!res.ok) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    setTodos(data.todos);
    setLoading(false);
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!title.trim()) return;

    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc }),
    });

    setTitle('');
    setDesc('');
    getTodos();
  }

  async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    getTodos();
  }

  async function toggleStatus(todo) {
    const newStatus = todo.status === 'pending' ? 'completed' : 'pending';
    await fetch(`/api/todos/${todo._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    getTodos();
  }

  async function updateTodo(id, newTitle, newDesc) {
    await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc }),
    });
    setEditing(null);
    getTodos();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const pending = todos.filter(t => t.status === 'pending').length;
  const completed = todos.filter(t => t.status === 'completed').length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        
        {/* header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Todos</h1>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Logout
          </button>
        </div>

        {/* add todo form */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <form onSubmit={addTodo}>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border mb-3 rounded"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border mb-3 rounded"
            />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
              Add Todo
            </button>
          </form>
        </div>

        {/* filter buttons */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Pending ({pending})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Completed ({completed})
          </button>
        </div>

        {/* todos list */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="bg-white p-6 rounded shadow text-center text-gray-800">
              No todos yet. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div key={todo._id} className="bg-white p-4 rounded shadow">
                {editing === todo._id ? (
                  // edit mode
                  <EditForm
                    todo={todo}
                    onSave={(t, d) => updateTodo(todo._id, t, d)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  // view mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={todo.status === 'completed'}
                          onChange={() => toggleStatus(todo)}
                          className="w-5 h-5"
                        />
                        <h3 className={todo.status === 'completed' ? 'line-through text-black' : ''}>
                          {todo.title}
                        </h3>
                      </div>
                      {todo.description && (
                        <p className="text-sm text-black mt-1 ml-7">{todo.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(todo._id)} className="text-blue-500 text-sm">
                        Edit
                      </button>
                      <button onClick={() => deleteTodo(todo._id)} className="text-red-500 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// edit form component
function EditForm({ todo, onSave, onCancel }) {
  const [title, setTitle] = useState(todo.title);
  const [desc, setDesc] = useState(todo.description);

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border mb-2 rounded"
      />
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        className="w-full px-3 py-2 border mb-2 rounded"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(title, desc)}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Save
        </button>
        <button onClick={onCancel} className="bg-gray-300 px-3 py-1 rounded text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}