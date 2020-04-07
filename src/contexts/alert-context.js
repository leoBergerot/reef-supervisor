import React, {createContext, useState} from 'react';
import Alert from '@material-ui/lab/Alert';
import Snackbar from "@material-ui/core/Snackbar";

export const alertContext = createContext({});

const AlertProvider = ({children}) => {
    const [alert, setAlert] = useState({open: false, message: null, severity: null});
    const handleClose = () => {
        setAlert({open: false})
    };
    return (
        <alertContext.Provider
            value={{setAlert}}
        >
            {alert.open && alert.message && alert.severity && (
                <Snackbar open={alert.open}>
                    <Alert variant="filled"
                           severity={alert.severity}
                           onClose={handleClose}
                    >
                        {alert.message}
                    </Alert>
                </Snackbar>
            )}
            {children}
        </alertContext.Provider>
    );
};

export default AlertProvider;
