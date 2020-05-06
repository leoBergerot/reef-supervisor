import React, {useContext, useEffect, useState} from "react";
import {default as MenuItemUi} from "@material-ui/core/MenuItem";
import {Avatar} from "./avatar";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {authContext} from "../../contexts/auth-context";
import {appFetch, GET} from "../../utils/app-fetch";
import {alertContext} from "../../contexts/alert-context";

const useStyles = makeStyles((theme) => ({
    avatar: {
        paddingRight: "0.5rem"
    },
}));

export const MenuItemAvatarWithRef = React.forwardRef((props, ref) => <MenuItemAvatar innerRef={ref} {...props} />);

const MenuItemAvatar = ({data, onClick}) => {
    const classes = useStyles();
    const [avatar, setAvatar] = useState(null);
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    useEffect(() => {
        if (data.avatar) {
            appFetch(
                GET,
                `tanks/${data.id}/avatars`,
                null,
                auth.token,
                (blob) => {
                    setAvatar(URL.createObjectURL(blob))
                },
                null,
                setAlert,
                true
            );
        } else {
            setAvatar(null)
        }
    }, [data]);
    return (
        <MenuItemUi onClick={onClick}>
            <div className={classes.avatar}>
                {avatar ?
                    <Avatar src={avatar} small/>
                    :
                    <Avatar small/>
                }
            </div>
            {data.name}
        </MenuItemUi>
    )
};