import React, {createRef, useContext} from "react";
import {makeStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TablePagination from '@material-ui/core/TablePagination';
import {default as TableRowUi} from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Skeleton from "@material-ui/lab/Skeleton";
import {HeaderList} from "./header-list";
import {ToolbarList} from "./toolbar-list";
import {MuiPickersContext} from "@material-ui/pickers";
import {TableRow} from "./row-table";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        height: "100%",
        position: "relative",
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
    container: {
        maxHeight: "calc(100% - 108px)",
    },
}));

export default function List({type, page, setPage, setRowsPerPage, rowsPerPage, total, data, setOrder, setOrderBy, order, orderBy}) {
    const classes = useStyles();
    const {moment} = useContext(MuiPickersContext);

    const refRows = [];

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const emptyRows = !data.loading ? (rowsPerPage - data.data.length) : 10;

    return (
        <Paper className={classes.root}>
            <ToolbarList type={type}/>
            <TableContainer className={classes.container}>
                <Table
                    stickyHeader
                    aria-labelledby={`List ${type.data.name}`}
                    aria-label={`List ${type.data.name}`}
                >
                    <HeaderList
                        classes={classes}
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                    />
                    <TableBody>
                        {data.data
                            .map((row, index) => {
                                refRows[row.id] = createRef();
                                return (
                                    <TableRow row={row} refRows={refRows} index={index} moment={moment} unit={type.data.unit}/>
                                );
                            })}
                        {emptyRows > 0 && data.loading && (
                            Array.apply(null, Array(emptyRows)).map((value, index) =>
                                <TableRowUi key={index} style={{height: 33}}>
                                    <TableCell>
                                        <Skeleton/>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton/>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton/>
                                    </TableCell>
                                </TableRowUi>
                            ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
                style={{position: "absolute", bottom: 0, right: 0}}
            />
        </Paper>
    );
}