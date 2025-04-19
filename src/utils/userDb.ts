interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  devices: {
    id: string;
    lastLogin: Date;
    expiresAt: Date;
  }[];
}

// Simple in-memory database for demo
const users: User[] = [
  {
    id: '1',
    name: 'Jackson Mugwe',
    email: 'mugwewaithaka2@gmail.com',
    password: 'hashed_password_here', // In real app, this would be properly hashed
    devices: []
  }
];

export const findUserByEmail = (email: string) => {
  return users.find(user => user.email === email);
};

export const addUser = (name: string, email: string, password: string) => {
  const newUser: User = {
    id: (users.length + 1).toString(),
    name,
    email,
    password, // In real app, this would be hashed
    devices: []
  };
  users.push(newUser);
  return newUser;
};

export const addDeviceToUser = (email: string, deviceId: string) => {
  const user = findUserByEmail(email);
  if (user) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
    
    user.devices = user.devices.filter(d => d.id !== deviceId); // Remove if exists
    user.devices.push({
      id: deviceId,
      lastLogin: new Date(),
      expiresAt
    });
    return true;
  }
  return false;
};

export const verifyDevice = (email: string, deviceId: string) => {
  const user = findUserByEmail(email);
  if (!user) return false;

  const device = user.devices.find(d => d.id === deviceId);
  if (!device) return false;

  return new Date() < device.expiresAt;
};
