import React, {useContext, useEffect, useState} from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import {authContext} from "../../contexts/auth-context";
import Typography from "@material-ui/core/Typography";
import {tankContext} from "../../contexts/tank-context";
import IconButton from "@material-ui/core/IconButton";
import {AccountCircle} from "@material-ui/icons";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Divider from "@material-ui/core/Divider";
import {alertContext} from "../../contexts/alert-context";

const useStyles = makeStyles((theme) => ({
    title: {
        flexGrow: 1,
    },
}));

export const Header = ({history}) => {
    const {auth, setAuthData} = useContext(authContext);
    const {tank, setTank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);

    const [tankList, setTankList] = useState({loading: true, data: []});


    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const classes = useStyles();

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };


    const onLogout = () => {
        handleClose();
        setAuthData(null)
    };

    const handleChangeTankClick = (data) => {
        handleClose();
        setTank({data: data});
    };

    const handleManageTanks = () => {
        handleClose();
        history.push("/tanks/manage")
    };

    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + '/tanks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setTankList({data: result, loading: false});
                },
                (error) => {
                    setTankList({loading: false, data: []});
                    setAlert({
                        open: true,
                        message: `An error occurred`,
                        severity: 'error'
                    });
                }
            );

    }, []);


    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" className={classes.title}>
                    Tank : {tank.data.name}
                </Typography>
                <div>
                    <IconButton
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle/>
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={open}
                        onClose={handleClose}
                    >
                        {!tankList.loading && tankList.data.map((value) => (
                            tank.data.id !== value.id && (
                                <MenuItem onClick={() => handleChangeTankClick(value)}
                                          key={value.id}>{value.name}</MenuItem>
                            )
                        ))
                        }
                        <MenuItem onClick={handleManageTanks} color="inherit">Manage tanks</MenuItem>
                        <Divider variant="middle"/>
                        <MenuItem onClick={handleClose} color="inherit">Account</MenuItem>
                        <MenuItem onClick={onLogout} color="inherit">Logout</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    )
};