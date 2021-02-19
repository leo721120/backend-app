Feature: User Controller

    Scenario: GET /users, 200
        Given url /users
        And login
            | username | password |
            | root     | test     |
        When method GET
        Then expect status should be '200'
        Then expect headers should contain
            | content-type                    |
            | application/json; charset=utf-8 |
        Then expect headers['content-type'] should be 'application/json; charset=utf-8'
        Then expect body.users[] should have length '1'
        Then expect body should contain
            """
            {
                "users": [
                    {
                        "id": "abc",
                        "name": "abc"
                    }
                ]
            }
            """

    Scenario Outline: GET /users/:id, 200
        Given url /users/<id>
        And login
            | username | password |
            | root     | test     |
        When method GET
        Then expect status should be '200'
        Then expect headers should contain
            | content-type                    |
            | application/json; charset=utf-8 |
        Then expect headers['content-type'] should be 'application/json; charset=utf-8'
        Then expect body should contain
            """
            {
                "user": {
                    "id": "<id>",
                    "name": "abc",
                    "password": "abc"
                }
            }
            """
        Examples:
            | id   |
            | 1a3  |
            | 1a3d |

    Scenario Outline: GET /users/:id, 400
        Given url /users/<id>
        And login
            | username | password |
            | root     | test     |
        When method GET
        Then expect status should be '400'
        Then expect headers should contain
            | content-type                    |
            | application/json; charset=utf-8 |
        Then expect headers['content-type'] should be 'application/json; charset=utf-8'
        Then expect body should contain
            """
            {
                "errors": [
                    {
                        "code": "MalformedData"
                    }
                ]
            }
            """
        Examples:
            | id        |
            | 1         |
            | 1a        |
            | 123456789 |