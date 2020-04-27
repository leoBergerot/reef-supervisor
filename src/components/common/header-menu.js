import React, {useContext, useEffect, useState} from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import {authContext} from "../../contexts/auth-context";
import {tankContext} from "../../contexts/tank-context";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Divider from "@material-ui/core/Divider";
import {alertContext} from "../../contexts/alert-context";
import {Avatar} from "./avatar";
import {MenuItemAvatar, MenuItemAvatarWithRef} from "./menu-item";
import MenuItem from "@material-ui/core/MenuItem";
import logo from "../../../asset/images/logo.svg";

const useStyles = makeStyles((theme) => ({
    logo: {
        display: "block",
        [theme.breakpoints.up("xs")]: {
            height: "60px"
        },
        [theme.breakpoints.down("xs")]: {
            height: "52px"
        }
    },
    divLogo: {
        flexGrow: 1
    }
}));

export const HeaderMenu = ({history}) => {
    const {auth, setAuthData} = useContext(authContext);
    const {tank, setTank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);

    const [tankList, setTankList] = useState({loading: true, data: []});
    const [avatar, setAvatar] = useState(null);

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
        history.push('/tanks/manage')
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

    useEffect(() => {
        if (tank.data && tank.data.avatar) {
            fetch(`${process.env.REACT_APP_API_URL}/tanks/${tank.data.id}/avatars`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + auth.token
                },
            })
                .then(res => {
                    if (res.status === 200) {
                        res.blob().then(blob => {
                            setAvatar(URL.createObjectURL(blob))
                        })
                    }
                });
        }else {
            setAvatar(null)
        }
    }, [tank.data]);

    return (
        <AppBar position="fixed" color="inherit" className={classes.root}>
            <Toolbar>
                <div className={classes.divLogo}>
                    <img alt="logo-reef-supervisor" className={classes.logo} src={logo}>
                    </img>
                </div>
                <div>
                    <IconButton
                        size="small"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        {avatar ? <Avatar src={avatar}/> :
                            <Avatar/>
                        }
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
                                <MenuItemAvatarWithRef onClick={() => handleChangeTankClick(value)}
                                                key={value.id} data={value}
                                />
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