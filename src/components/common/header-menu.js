import React, {useContext, useEffect, useState} from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import {authContext} from "../../contexts/auth-context";
import {tankContext} from "../../contexts/tank-context";
import Menu from "@material-ui/core/Menu";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Divider from "@material-ui/core/Divider";
import {alertContext} from "../../contexts/alert-context";
import {Avatar} from "./avatar";
import {MenuItemAvatar, MenuItemAvatarWithRef} from "./menu-item";
import MenuItem from "@material-ui/core/MenuItem";
import logo from "../../../asset/images/logo.svg";
import {appFetch, GET} from "../../utils/app-fetch";
import {typeContext} from "../../contexts/type-context";
import {LanguageSelect} from "./language-select";
import {useTranslation} from "react-i18next";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCaretDown, faCaretUp} from "@fortawesome/free-solid-svg-icons";

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
    const {getAuthToken, setAuthData} = useContext(authContext);
    const {tank, setTankData} = useContext(tankContext);
    const {setTypeData} = useContext(typeContext);
    const {setAlert} = useContext(alertContext);

    const [tankList, setTankList] = useState({loading: true, data: []});
    const [avatar, setAvatar] = useState(null);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const classes = useStyles();
    const {t} = useTranslation();

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const onLogout = () => {
        handleClose();
        setAuthData(null);
        setTankData(null);
        setTypeData(null);
        history.push('/login')
    };

    const handleChangeTankClick = (data) => {
        handleClose();
        setTankData(data);
    };

    const handleManageTanks = () => {
        handleClose();
        history.push('/tanks/manage')
    };

    useEffect(() => {
        appFetch(
            GET,
            'tanks',
            null,
            getAuthToken(),
            (result) => {
                setTankList({data: result, loading: false});
            },
            () => {
                setTankList({loading: false, data: []});
            },
            setAlert
        )
    }, []);

    useEffect(() => {
        if (tank.data && tank.data.avatar) {
            appFetch(
                GET,
                `tanks/${tank.data.id}/avatars`,
                null,
                getAuthToken(),
                blob => (
                    setAvatar(URL.createObjectURL(blob))
                ),
                null,
                setAlert,
                true
            );
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
                    <Typography variant="overline" style={{margin: " 0 0.5rem 0 0.5rem"}}>
                        {tank.data.name}
                    </Typography>
                    <Button
                        disableTouchRipple
                        disableRipple
                        disableFocusRipple
                        disableElevation
                        size="small"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                        style={{position: "relative"}}
                    >
                        {avatar ? <Avatar src={avatar}/> :
                            <Avatar/>
                        }
                        <FontAwesomeIcon icon={open ? faCaretUp : faCaretDown}
                                         style={{position: "absolute", right: "-5px"}} size="md"/>
                    </Button>
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
                        <MenuItem onClick={handleManageTanks} color="inherit">{t('menu.manage')}</MenuItem>
                        {/*<Divider variant="middle"/>*/}
                        {/*<MenuItem onClick={handleClose} color="inherit">Account</MenuItem>*/}
                        <Divider variant="middle"/>
                        <MenuItem disableRipple>
                            <LanguageSelect fullWidth/>
                        </MenuItem>
                        <Divider variant="middle"/>
                        <MenuItem onClick={onLogout} color="inherit">{t('menu.logout')}</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    )
};