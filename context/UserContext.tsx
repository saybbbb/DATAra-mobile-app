import React, { createContext, ReactNode, useContext, useState } from 'react';

interface UserContextType {
    phone: string;
    setPhone: (phone: string) => void;
    readNotifIds: number[];
    setReadNotifIds: (ids: number[]) => void;
}

const UserContext = createContext<UserContextType>({
    phone: '',
    setPhone: () => { },
    readNotifIds: [],
    setReadNotifIds: () => { },
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [phone, setPhone] = useState<string>('');
    const [readNotifIds, setReadNotifIds] = useState<number[]>([]);

    return (
        <UserContext.Provider value={{ phone, setPhone, readNotifIds, setReadNotifIds }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
