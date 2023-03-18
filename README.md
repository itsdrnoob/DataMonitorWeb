[![Platform](https://shields.io/badge/platform-web-red.svg)]()
[![License](https://img.shields.io/badge/license-GPL3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[![Chat](https://img.shields.io/badge/Telegram%20Chat-blue?logo=telegram)](https://t.me/datamonitor)
[![Status](https://img.shields.io/website?down_message=Offline&label=Status&logoColor=white&up_message=Online&url=https%3A%2F%2Fdatamonitorweb.vercel.app)](https://t.me/datamonitor)

# Data Monitor Web
## Introduction
Data Monitor Web contains a set of utilities to help with <a href="https://github.com/itsdrnoob/DataMonitor">Data Monitor</a>.

<hr>

## Installation
1. Clone the repo:
    ```shell
    git clone https://github.com/itsdrnoob/DataMonitorWeb.git
    ```
2. Switch to the working directory:
    ```shell
    cd DataMonitorWeb
    ```
3. Install the required dependencies:
    ```shell
    npm install
    ```
4. Create a `.env` file and add the following variables to it:
    ```
    TOKEN = <ACCESS_TOKEN>
    IP_TOKEN = <TOKEN FROM ipinfo.io>
    ```
5. Start the server:
    ```shell
    npm start
    ```

<hr>

## Endpoints
- ### **_`/fetchIp`_**
    This endpoint accepts a GET request and returns the IP address of the requested user in a string format. On localhost it will return 127.0.0.1 if you're using IPv4 
    or ::1, ::ffff:127.0.0.1 if you're using IPv6.

    **Request**
    ```javascript
    GET /fetchIp
    ```

    **Response**
    ```javascript
    192.168.0.1
    ```


- ### **_`/ipLookup`_**
    This endpoint accepts a GET request along with a header _`token`_ that contains the API key. If the token is valid, the endpoint returns a JSON containing the requested user's IP address, city, region, country, and network provider.

    **Request**
    ```javascript
    GET /ipLookup
    ```

    **Response**
    ```json
    {
        "ip": "192.168.0.1",
        "city": "New York",
        "region": "NY",
        "country": "US",
        "org": "AT&T Services, Inc."
    }
    ```

    **Header**
    | Field | Type | Required | Description |
    |--------|--------|--------|--------|
    | token | String | Yes |  Specifies the access token  |

<hr>

## Rate Limiting
The endpoint _`/ipLookup`_ is rate-limited to prevent abuse. Users can make a maximum of 25 requests every 10 minutes. If the rate limit is exceeded, the API returns HTTP Error 429.

<hr>

## Contributing
Contributions to the project are always welcome. Here are a few guidelines to help you get started: 
- Fork the project and create a new branch for your changes.
- Make your changes and test them thoroughly.
- If fixing an already reported bug, make sure to mention 'Fixes #' in the desctiption.
- Submit a pull request.

<hr>

## License

DataMonitorWeb is released under GPL-3.0 license. Click <a href="https://github.com/itsdrnoob/DataMonitorWeb/blob/HEAD/LICENSE">here</a> for more information.

<hr>

## Dependencies
Details regarding dependencies used in the project can be found in the <a href="https://github.com/itsdrnoob/DataMonitorWeb/blob/HEAD/dependencies.json">dependencies.json</a> file.