import React from 'react';
import styled from "styled-components";
import {Button} from "@mui/material";
import isMobile from "../isMobile";

export const InactiveMintButton = () => {
    const CTAButton = styled(Button)`
  display: block !important;
  margin: 0 auto !important;
  background-color: #616A6B !important;
  min-width: 120px !important;
  width: 100%;
  font-size: 1em !important;
  color: #fff !important;
  font-family: Main !important;
  font-weight: bold !important;
`;

    const alertMessage = "Mint is not live yet!"

    return (
            <CTAButton variant="contained" onClick={() => alert(alertMessage)}>
                Mint
            </CTAButton>

    );
};
