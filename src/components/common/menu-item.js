import React, {useContext, useEffect, useState} from "react";
import {default as MenuItemUi} from "@material-ui/core/MenuItem";
import {Avatar} from "./avatar";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {authContext} from "../../contexts/auth-context";

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
    useEffect(() => {
        if (data.avatar) {
            fetch(`${process.env.REACT_APP_API_URL}/tanks/${data.id}/avatars`, {
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