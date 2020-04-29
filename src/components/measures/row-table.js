import React, {useContext, useEffect, useState} from "react";
import {default as TableRowUi} from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import {Actions} from "./actions";
import {MeasureField} from "../common/measure-field";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {Skeleton} from "@material-ui/lab";
import {DatePicker} from "../common/date-picker";
import isEmpty from "validator/es/lib/isEmpty";


export const TableRow = ({moment, refRows, index, row, unit}) => {
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);
    const [edit, setEdit] = useState(false);
    const [selectedDate, handleChangeDate] = useState(moment(row.createdAt));
    const [value, setValue] = useState({value: row.value, error: false});
    const [loading, setLoading] = useState(false);
    const [currentValues, setCurrentValues] = useState({createdAt: moment(row.createdAt), value: row.value});

    useEffect(() => {
        if (!edit) {
            handleChangeDate(currentValues.createdAt);
            setValue({value: currentValues.value, error: false});
        }

    }, [edit]);

    useEffect(() => {
        handleChangeDate(currentValues.createdAt);
        setValue({value: currentValues.value, error: false});
    }, [currentValues]);

    const handleSave = (event) => {
        event.preventDefault();
        let error = false;
        if (isEmpty(value.value.toString())) {
            setValue({value: value.value, error: true, helperText: "Please enter a correct value"});
            error = true;
        }
        if (!error) {
            setEdit(false);
            setLoading(true);
            fetch(`${process.env.REACT_APP_API_URL}/measures/${row.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    value: value.value,
                    createdAt: selectedDate,
                })
            })
                .then(res => res.json())
                .then(
                    (result) => {
                        if (result.id) {
                            setCurrentValues({value: result.value, createdAt: result.createdAt})
                        } else {
                            setAlert({
                                open: true,
                                message: `An error occurred`,
                                severity: 'error'
                            });
                        }
                        setLoading(false);
                    },
                    (error) => {
                        setLoading(false);
                        setAlert({
                            open: true,
                            message: `Network error`,
                            severity: 'error'
                        });
                    });
        }
    };

    return (
        <TableRowUi
            hover
            key={index}
            ref={ref => (refRows[row.id]) = ref}
        >
            {!edit ?
                !loading ?
                    <TableCell>
                        {moment(currentValues.createdAt).format('DD/MM/YY HH:mm')}
                    </TableCell> :
                    <TableCell>
                        <Skeleton/>
                    </TableCell>
                :
                <TableCell>
                    <DatePicker selectedDate={selectedDate} handleDateChange={handleChangeDate} small/>
                </TableCell>
            }
            {!edit ?
                !loading ?
                    <TableCell>{`${currentValues.value} ${unit}`}</TableCell>
                    :
                    <TableCell>
                        <Skeleton/>
                    </TableCell>
                :
                <TableCell>
                    <MeasureField
                        small
                        value={value.value}
                        error={value.error}
                        helperText={value.helperText}
                        placeholder={unit}
                        onChange={(event) => setValue({value: event.target.value, error: false})}
                        name="value"
                        id="value"
                    />
                </TableCell>
            }
            <TableCell>
                <Actions id={row.id} rowsRef={refRows} edit={edit}
                         setEdit={setEdit} handleSave={handleSave} disabled={loading}/>
            </TableCell>
        </TableRowUi>
    )
};