if("__TAURI__"in window){var __TAURI_PLUGIN_AUTHENTICATOR__=function(t){"use strict";async function i(t,i={},a){return window.__TAURI_INTERNALS__.invoke(t,i,a)}"function"==typeof SuppressedError&&SuppressedError;return t.Authenticator=class{async init(){await i("plugin:authenticator|init_auth")}async register(t,a){return await i("plugin:authenticator|register",{timeout:1e4,challenge:t,application:a})}async verifyRegistration(t,a,e,n){return await i("plugin:authenticator|verify_registration",{challenge:t,application:a,registerData:e,clientData:n})}async sign(t,a,e){return await i("plugin:authenticator|sign",{timeout:1e4,challenge:t,application:a,keyHandle:e})}async verifySignature(t,a,e,n,r,u){return await i("plugin:authenticator|verify_signature",{challenge:t,application:a,signData:e,clientData:n,keyHandle:r,pubkey:u})}},t}({});Object.defineProperty(window.__TAURI__,"authenticator",{value:__TAURI_PLUGIN_AUTHENTICATOR__})}
