import React, {createContext, useEffect, useState} from 'react';

export const typeContext = createContext({});

const TypeProvider = ({children}) => {
    const [type, setType] = useState({data: null, loading: true});


    useEffect(() => {
        setType({
            loading: false,
            data: window.localStorage.getItem('typeData') !== "undefined" ? JSON.parse(window.localStorage.getItem('typeData')) : null
        });
    }, []);

    useEffect(() => {
        window.localStorage.setItem('typeData', JSON.stringify(type.data));
    }, [type.data]);

    return (
        <typeContext.Provider
            value={{setType, type}}
        >
            {children}
        </typeContext.Provider>
    );
};

export default TypeProvider;
