import {screen} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import firebase from "../__mocks__/firebase";
import {ROUTES, ROUTES_PATH} from "../constants/routes";
import mockedFirestore from "../__mocks__/firestore";

beforeEach(() => {
  const html = NewBillUI();
  document.body.innerHTML = html;
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should render NewBill page", () => {
      const newBillForm = screen.getByTestId("form-new-bill");
      expect(newBillForm).toBeTruthy();
    });

    describe("When I upload a correct file", () => {
      test("Then the error message should not be visible", () => {
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({pathname});
        };
        const newBill = new NewBill({document, onNavigate, firestore: mockedFirestore, localStorage: window.localStorage});
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        userEvent.upload(inputFile, new File(["image.png"], "image.png", {type: "image/png"}));
        expect(handleChangeFile).toHaveBeenCalled();
        expect(screen.getByTestId("error-msg").classList).not.toContain("visible");
      });
    });

    describe("When I upload a file with the wrong format", () => {
      test("Then the error message should be visible", () => {
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({pathname});
        };
        const newBill = new NewBill({document, onNavigate, firestore: null, localStorage: window.localStorage});
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        userEvent.upload(inputFile, new File(["image.txt"], "image.txt"));
        expect(handleChangeFile).toHaveBeenCalled();
        expect(screen.getByTestId("error-msg").classList).toContain("visible");
      });
    });
  });
});
describe("When I submit the creation form", () => {
  test("Then I should be redirected to the bills page", () => {
    localStorage.setItem("user", JSON.stringify({type: "Employee", email: "a@a"}));
    const html = NewBillUI();
    const onNavigate = jest.fn();
    document.body.innerHTML = html;
    new NewBill({document, onNavigate, firestore: null, localStorage: window.localStorage});
    const submitButton = screen.getByTestId("submit-btn");
    userEvent.click(submitButton);
    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
  });
});

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create a new bill", () => {
    test("add bill to mock API POST", async () => {
      const newBill = {
        id: "UIUZtnPQvnbFnB0ozvJh",
        name: "test",
        email: "a@a",
        type: "Services en ligne",
        vat: "60",
        pct: 20,
        commentAdmin: "bon bah d'accord",
        amount: 300,
        status: "accepted",
        date: "2003-03-03",
        commentary: "",
        fileName: "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.png",
        fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…dur.png?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3"
      };
      const postSpy = jest.spyOn(firebase, "post");
      const bills = await firebase.post(newBill);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(5);
    });
    test("add bill to API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));
      const html = BillsUI({error: "Erreur 404"});
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("add bill to API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")));
      const html = BillsUI({error: "Erreur 500"});
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});