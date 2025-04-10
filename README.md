1. Fork and clone the repository to your local machine.
2. Check out the `dev` branch.

### Backend Setup
3. Create a `.env` file in the `./backend` folder.
4. Add the necessary environment variables to the `.env` file. Refer to `.env.example` for guidance.
5. Configure the required metafields and metaobjects in your store:
  - Create a metaobject definition named `option_values`.
    - Add a field `option` with the type `Single line text`.
  - Create another metaobject definition named `variant`.
    - Add the following fields:
     - `variant`
     - `image`
     - `options_combination` (a metaobject field referencing `option_values` with list type).
  - Create a metafield on the product with the name `variants`.
    - Add a field with the type `List of entries` and set it to reference the `variant` metaobject.

6. Once the store setup is complete, create a custom app in your store.
  - Grant API access for products and metaobjects.
  - Capture the API credentials of the app and add them to the `.env` file in the `./backend` folder.

7. Install the backend environment.
8. Run the HTML file and provide the required password.
9. You're all set!