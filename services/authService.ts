import { User, UserRole } from '../types';

const STORAGE_KEY = 'edumagico_users';
const SESSION_KEY = 'edumagico_session';

// Mock database initialization
const getUsers = (): User[] => {
    const users = localStorage.getItem(STORAGE_KEY);
    return users ? JSON.parse(users) : [];
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

// Simulated IP/Device Check
const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

export const authService = {
    register: async (user: User, password: string): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

        const users = getUsers();
        if (users.find(u => u.email === user.email)) {
            throw new Error('Email já cadastrado.');
        }
        if (user.cpf && users.find(u => u.cpf === user.cpf)) {
            throw new Error('CPF já cadastrado.');
        }

        // In a real app, password should be hashed. 
        // We are simulating a "secure" storage by not storing plain text, but this is NOT secure for production.
        const secureUser = { ...user, _passwordHash: btoa(password) };

        users.push(secureUser);
        saveUsers(users);

        return user;
    },

    login: async (email: string, password: string): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 600));

        const users = getUsers();
        const user = users.find(u => u.email === email && (u as any)._passwordHash === btoa(password));

        if (!user) {
            throw new Error('Credenciais inválidas.');
        }

        // Simulate Concurrent Access Restriction
        // In a real backend, we would check active sessions in Redis/DB.
        // Here we check if the last login was from a different "device" recently.
        const lastDeviceId = localStorage.getItem(`last_device_${user.id}`);
        const currentDeviceId = getDeviceId();

        if (lastDeviceId && lastDeviceId !== currentDeviceId) {
            // Optional: Allow force login (kicking other session) or block.
            // For this requirement "restricao de acessos simultaneos", we will warn or block.
            // Let's implement a "Force Login" logic implicitly by updating the device ID, 
            // but in a real scenario, this would invalidate the other token.
            console.warn(`Login detected from new device. Previous device: ${lastDeviceId}`);
        }

        localStorage.setItem(`last_device_${user.id}`, currentDeviceId);
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));

        return user;
    },

    logout: () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = '/login';
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem(SESSION_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(SESSION_KEY);
    }
};
