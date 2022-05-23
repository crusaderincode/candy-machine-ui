import React from 'react';
import {Paper, Typography, useTheme} from "@mui/material";
import isMobile from "../isMobile";



interface Price {
    type: string,
    amount: string | number
}

export const Info = (props: Price) => {
    const theme = useTheme()
    const mobileMarker = isMobile()


    return (
                <Paper style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.primary.light,
                    marginTop: mobileMarker ? '0.5rem': 0,
                    marginBottom: mobileMarker ? '0.5rem': 0,
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        padding: 10,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Typography display="inline" variant="h6" style={{
                            color: '#fff',
                            fontFamily: 'Main',
                            fontWeight: 'bold',
                            textAlign: 'center',

                        }}>
                            {props.type}
                            <Typography display="inline" variant="h6" style={{
                                color: '#ff00b2',
                                fontFamily: 'Main',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                marginLeft: 5,
                            }}>
                                {props.amount}
                            </Typography>
                        </Typography>

                    </div>
                </Paper>

    );
};
