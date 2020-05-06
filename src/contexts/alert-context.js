import React, {createContext, useState} from 'react';
import Alert from '@material-ui/lab/Alert';
import Snackbar from "@material-ui/core/Snackbar";
import {makeStyles} from "@material-ui/core/styles";

export const alertContext = createContext({});

const useStyle = makeStyles((theme) => (
    {
        filledSuccess: {
            color: '#fff !important',
            fontWeight: theme.typography.fontWeightMedium,
            backgroundColor: theme.palette.success.main + '!important'
        },
    }
))
const AlertProvider = ({children}) => {
    const [alert, setAlert] = useState({open: false, message: null, severity: null});

    const classes = useStyle();

    const handleClose = () => {
        setAlert({open: false})
    };
    return (
        <alertContext.Provider
            value={{setAlert}}
        >
            {alert.open && alert.message && alert.severity && (
                <Snackbar open={alert.open}
                          onClose={handleClose}
                    autoHideDuration={3000}
                >
                    <Alert
                        classes={{filledSuccess: classes.filledSuccess}}
                        variant="filled"
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
