import {EXPIRED} from "../contexts/auth-context";

export const GET = 'GET';
export const POST = 'POST';
export const PATCH = 'PATCH';
export const DELETE = 'DELETE';

export const appFetch = (method, endpoint, body, token, onSuccess, onError, setAlert, blob = false) => {

    let status = null;
    if (token !== EXPIRED) {
        fetch(`${process.env.REACT_APP_API_URL}/${endpoint}`, {
            method: method,
            headers: {
                ...(body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
                ...(token ? {'Authorization': `Bearer ${token}`} : {})
            },
            ...(body ? {body: (!(body instanceof FormData) ? JSON.stringify(body) : body)} : {})
        })
            .then(res => {
                    status = res.status;
                    if (status === 200 && method === DELETE) {
                        onSuccess();
                    } else if (status === 200 || status === 201) {
                        return !blob ? res.json() : res.blob();
                    } else {
                        throw res
                    }
                }
            )
            .then(
                (result) => {
                    onSuccess(result)
                },
                (error) => {
                    if (error instanceof TypeError) {
                        //no network
                        setAlert({
                            open: true,
                            message: "error.no_network",
                            severity: 'error'
                        });
                    } else {
                        // server error
                        switch (error.status) {
                            case 502:
                            case 500:
                                setAlert({
                                    open: true,
                                    message: "error.500",
                                    severity: 'error'
                                });
                                break;
                            case 401:
                                setAlert({
                                    open: true,
                                    message: "error.unauthorized",
                                    severity: 'warning'
                                });
                                break
                        }
                        if (onError) {
                            try {
                                error.json().then(
                                    (res) => (onError(res))
                                )
                            } catch (e) {
                                onError(null)
                            }
                        }
                    }
                }
            )
    }
};