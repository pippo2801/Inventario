[1mdiff --git a/src/main.tsx b/src/main.tsx[m
[1mindex 080dac3..3d7150d 100644[m
[1m--- a/src/main.tsx[m
[1m+++ b/src/main.tsx[m
[36m@@ -1,10 +1,10 @@[m
[31m-import {StrictMode} from 'react';[m
[31m-import {createRoot} from 'react-dom/client';[m
[31m-import App from './App.tsx';[m
[31m-import './index.css';[m
[32m+[m[32mimport React from 'react'[m
[32m+[m[32mimport ReactDOM from 'react-dom/client'[m
[32m+[m[32mimport App from './App.tsx'[m
[32m+[m[32mimport './index.css'[m
 [m
[31m-createRoot(document.getElementById('root')!).render([m
[31m-  <StrictMode>[m
[32m+[m[32mReactDOM.createRoot(document.getElementById('root')!).render([m
[32m+[m[32m  <React.StrictMode>[m
     <App />[m
[31m-  </StrictMode>,[m
[31m-);[m
[32m+[m[32m  </React.StrictMode>,[m
[32m+[m[32m)[m
[1mdiff --git a/src/views/FastSaleModal.tsx b/src/views/FastSaleModal.tsx[m
[1mindex 3c2defc..ad9a4de 100644[m
[1m--- a/src/views/FastSaleModal.tsx[m
[1m+++ b/src/views/FastSaleModal.tsx[m
[36m@@ -1,5 +1,5 @@[m
 import React, { useState } from 'react';[m
[31m-import { X, CheckCircle2, Search, MapPin, CreditCard, Banknote, Building, Tag } from 'lucide-react';[m
[32m+[m[32mimport { X, CheckCircle2, Search, MapPin, CreditCard, Banknote, Building, Tag, ShoppingBag } from 'lucide-react';[m
 import { Eyeglass, Client, PaymentMethod, User } from '../types';[m
 [m
 interface FastSaleModalProps {[m
