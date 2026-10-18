import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieItem } from './cookie-item';

describe('CookieItem', () => {
  let component: CookieItem;
  let fixture: ComponentFixture<CookieItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookieItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CookieItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
