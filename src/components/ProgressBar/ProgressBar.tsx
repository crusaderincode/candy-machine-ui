import React from 'react';
import {BorderLinearProgress} from "../styled";
import {Paper, useTheme, Typography} from "@mui/material";
import isMobile from "../isMobile";

interface Progress {
    redeemed: number,
    available: number
}

export const ProgressBar = (props: Progress) => {
    const theme = useTheme()
    const mobileMarker = isMobile()

    return (
        <Paper style={{
            backgroundColor: theme.palette.primary.light,
            paddingTop: 5,
            marginTop: mobileMarker ? '0.5rem' : 0,
            marginBottom: mobileMarker ? '1rem' : 0,
        }}>
            <Typography display="inline" variant="h5" style={{
                color: '#fff',
                fontFamily: 'Main',
                fontWeight: 'bold',
                textAlign: 'center',

            }}>
                Minted
            <Typography display="inline" variant="h5" style={{
                color: theme.palette.primary.contrastText,
                fontFamily: 'Main',
                fontWeight: 'bold',
                textAlign: 'center',
                marginLeft: 5
            }}>
                {props.redeemed} / {props.available}</Typography>
            </Typography>
            <BorderLinearProgress
                style={{
                    width: '95%',
                    marginRight: 0,
                    marginLeft: '2%',
                }}
                variant="determinate"
                value={100 - ((props.available - props.redeemed) * 100 / props.available)}/>
        </Paper>
    );
};

