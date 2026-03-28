import React, { createContext, ReactNode, useContext, useState } from 'react';

interface UserContextType {
    phone: string;
    setPhone: (phone: string) => void;
}

const UserContext = createContext<UserContextType>({
    phone: '',
    setPhone: () => { },
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [phone, setPhone] = useState<string>('');

    return (
        <UserContext.Provider value={{ phone, setPhone }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
