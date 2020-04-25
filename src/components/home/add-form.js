import React, {useState} from "react";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";
import NumberFormat from 'react-number-format';
import makeStyles from "@material-ui/core/styles/makeStyles";
import {KeyboardDateTimePicker} from '@material-ui/pickers';

const useStyles = makeStyles(theme => ({
    form: {
        height: size => size.size,
        width: size => size.size,
    },
    fields: {
        [theme.breakpoints.up("xs")]: {
            '& div': {
                fontSize: "1.1em"
            },
            padding: "1rem",
        },
        [theme.breakpoints.down("xs")]: {
            '& div': {
                fontSize: "1em",
            },
            '& button': {
                padding: "2px"
            },
            padding: "0.3rem",
        },
        [theme.breakpoints.up("md")]: {
            '& div': {
                fontSize: "1.3em"
            },
            padding: "1.5rem",
        },
    }
}));

export const AddFormWithRef = React.forwardRef((props, ref) => <AddForm innerRef={ref} {...props} />);

const AddForm = ({open, handleClose, anchorEl, id, defaultValue, name, unit, size}) => {

    const [value, setValue] = useState({value: defaultValue, error: false, helperText: null});
    const [createdAt, setCreatedAt] = useState({value: new Date(), error: false});

    const classes = useStyles({size});

    const handleChange = (event) => {
        setValue({
            ...value,
            [event.target.name]: event.target.value,
        });
    };

    const handleDateChange = (date) => {
        setCreatedAt({value: date, error: false})
    };

    return (
        <Popover
            id={id}
            open={open}
            disablePortal={true}

            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
            }}
        >
            <form className={classes.form}>
                <div className={classes.fields}>
                    <TextField
                        fullWidth
                        label={`${name} value`}
                        value={value.value}
                        placeholder={unit}
                        onChange={handleChange}
                        name="value"
                        id="value"
                        InputProps={{
                            inputComponent: NumberFormatCustom,
                        }}
                    />
                    <>
                        <KeyboardDateTimePicker
                            variant="inline"
                            format="DD/MM/YY HH:mm"
                            margin="normal"
                            id="date"
                            label="Date"
                            value={createdAt.value}
                            onChange={handleDateChange}
                            onError={() => {
                                createdAt.error = true
                            }}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                        />
                    </>
                </div>
            </form>
        </Popover>
    )
};

function NumberFormatCustom(props) {
    const {inputRef, onChange, placeholder, ...other} = props;
    return (
        <NumberFormat
            {...other}
            getInputRef={inputRef}
            onValueChange={(value) => {
                onChange({
                    target: {
                        name: props.name,
                        value: value.value,
                    },
                });
            }}
            isNumericString
            allowNegative={false}
            thousandSeparator=" "
            decimalScale
            suffix={` ${placeholder}`}
        />
    );
}
