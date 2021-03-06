import React, {createContext, useEffect, useState} from 'react';

export const tankContext = createContext({});

const TankProvider = ({children}) => {

    const [tank, setTank] = useState({loading: true, data: null});

    const setTankData = (data) => {
        setTank({data: data});
    };

    useEffect(() => {
        setTank({
            loading:false,
            data: window.localStorage.getItem('tankData') !== "undefined" ? JSON.parse(window.localStorage.getItem('tankData')) : null
        });
    }, []);

    useEffect(() => {
        window.localStorage.setItem('tankData', JSON.stringify(tank.data));
    }, [tank.data]);

    return (
        <tankContext.Provider
            value={{setTankData, tank}}
        >
            {children}
        </tankContext.Provider>
    );
};

export default TankProvider;
