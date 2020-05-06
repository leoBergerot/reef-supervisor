import React, {createContext, useEffect, useState} from 'react';

export const typeContext = createContext({});

const TypeProvider = ({children}) => {
    const [type, setType] = useState({data: null, loading: true});

    const setTypeData = (data) => {
        setType({data: data})
    };

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
            value={{setTypeData, type}}
        >
            {children}
        </typeContext.Provider>
    );
};

export default TypeProvider;
