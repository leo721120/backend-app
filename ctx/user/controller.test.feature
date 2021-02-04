Feature: User Controller

    Scenario: GET /users
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