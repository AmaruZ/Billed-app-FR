import {screen, fireEvent} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import {bills} from "../fixtures/bills.js";
import Firestore from "../app/Firestore";
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import Router from "../app/Router";
import {localStorageMock} from "../__mocks__/localStorage";
import Bills from "../containers/Bills.js";
import firebase from "../__mocks__/firebase";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Firestore.bills = () => ({
        bills,
        get: jest.fn().mockResolvedValue()
      });
      const html = BillsUI({data: [bills]});
      const pathname = ROUTES_PATH["Bills"];
      document.location = pathname;
      window.localStorage.setItem("user", JSON.stringify({type: "Employee"}));
      document.body.innerHTML = `<div id='root'>${html}</div>`;
      Router();
      expect(screen.getByTestId("icon-window").classList).toContain("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({data: bills});
      document.body.innerHTML = html;
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => (
        a < b
        ? 1
        : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When I am on Bills page but it is loading", () => {
    test("Then it should render the Loading page", () => {
      const html = BillsUI({loading: true});
      document.body.innerHTML = html;
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });
  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then it should render the Error page with its error message", () => {
      const error = 'Erreur de connexion internet'
      const html = BillsUI({error: error})
      document.body.innerHTML = html
      expect(screen.getAllByText("Erreur de connexion internet")).toBeTruthy()
    });
  });
});

describe("When I click on the New Bill button", () => {
  test("Then it should render the New Bill Page", () => {
    const html = BillsUI({data: []});
    document.body.innerHTML = html;
    const onNavigate = pathname => {
      document.body.innerHTML = ROUTES({pathname});
    };
    Object.defineProperty(window, "localStorage", {value: localStorageMock});
    window.localStorage.setItem("user", JSON.stringify({type: "Employee"}));
    const billsPage = new Bills({document, onNavigate, firestore: null, localStorage: window.localStorage});
    const handleClickNewBill = jest.fn(billsPage.handleClickNewBill);
    const buttonNewBill = screen.getByTestId("btn-new-bill");
    expect(buttonNewBill).toBeTruthy();
    buttonNewBill.addEventListener("click", handleClickNewBill);
    fireEvent.click(buttonNewBill);
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
  });

  describe("When I click on the icon eye", () => {
    test("Then it should open a modal", () => {
      const html = BillsUI({data: bills});
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", {value: localStorageMock});
      window.localStorage.setItem("user", JSON.stringify({type: "Employee"}));
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({pathname});
      };
      const billsPage = new Bills({document, onNavigate, firestore: null, localStorage: window.localStorage});
      $.fn.modal = jest.fn();
      const iconsEye = screen.getAllByTestId("icon-eye");
      const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);
      iconsEye.forEach(icon => icon.addEventListener("click", e => handleClickIconEye(icon)));
      iconsEye.forEach(icon => fireEvent.click(icon));
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById("modaleFile");
      expect(modale).toBeTruthy();
    });
  });
});
// test d'intégration GET
describe("When I navigate to Bills Page", () => {
  test("fetches bills from mock API GET", async () => {
    const getSpy = jest.spyOn(firebase, "get");
    const userBills = await firebase.get();
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(userBills.data.length).toBe(4);
  });

  test("fetches bills from an API and fails with 404 message error", async () => {
    firebase.get.mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")));
    const html = BillsUI({error: "Erreur 404"});
    document.body.innerHTML = html;
    const message = await screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });
  test("fetches messages from an API and fails with 500 message error", async () => {
    firebase.get.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")));
    const html = BillsUI({error: "Erreur 500"});
    document.body.innerHTML = html;
    const message = await screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
