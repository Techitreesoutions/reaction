import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const ShopSettingsQuery = importAsString("./ShopSettingsQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = encodeOpaqueId("reaction/shop", internalShopId); // reaction/shop:123
const shopName = "Test Shop";
let testApp;
let shopSettings;

const mockShopSettings = {
  shopId: internalShopId,
  sitemapRefreshPeriod: "every 24 hours"
};

const adminGroup = Factory.Group.makeOne({
  _id: "adminGroup",
  createdBy: null,
  name: "admin",
  permissions: ["reaction:legacy:shops/read"],
  slug: "admin",
  shopId: internalShopId
});

const mockCustomerAccount = Factory.Account.makeOne({
  groups: [adminGroup._id],
  shopId: internalShopId
});


beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.collections.AppSettings.insertOne(mockShopSettings);
  await testApp.createUserAndAccount(mockCustomerAccount);
  shopSettings = testApp.query(ShopSettingsQuery);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("a user with `reaction:legacy:shops/read` permissions shop manager can view shop settings", async () => {
  let result;
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    result = await shopSettings({
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.shopSettings.sitemapRefreshPeriod).toEqual("every 24 hours");
});
